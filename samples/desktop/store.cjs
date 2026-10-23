const { readFile, writeFile, mkdir, rename, copyFile } = require("node:fs/promises");
const { join } = require("node:path");
const { seed, validate } = require("./model.js");
class Store {
  constructor(directory) {
    this.directory = directory;
    this.file = join(directory, "journal.json");
    this.blocked = false;
    this.queue = Promise.resolve();
  }
  async load() {
    try {
      const data = await readFile(this.file, "utf8");
      if (Buffer.byteLength(data, "utf8") > 500000)
        throw Error("Saved file exceeds the supported size.");
      return validate(JSON.parse(data));
    } catch (e) {
      if (e.code === "ENOENT") return structuredClone(seed);
      this.blocked = true;
      throw Error(
        "Saved data needs recovery. Keep journal.json and journal.previous.json before changing anything.",
      );
    }
  }
  save(value) {
    const clean = validate(value);
    this.queue = this.queue
      .catch(() => {})
      .then(async () => {
        if (this.blocked)
          throw Error("Saved data needs recovery; the existing file has not been overwritten.");
        await mkdir(this.directory, { recursive: true });
        try {
          const old = await readFile(this.file, "utf8");
          if (Buffer.byteLength(old) > 500000) throw Error("Existing journal needs recovery.");
          validate(JSON.parse(old));
          await copyFile(this.file, join(this.directory, "journal.previous.json"));
        } catch (e) {
          if (e.code !== "ENOENT") throw e;
        }
        const temp = join(this.directory, "journal.pending.json");
        await writeFile(temp, JSON.stringify(clean, null, 2), { mode: 0o600 });
        await rename(temp, this.file);
        return true;
      });
    return this.queue;
  }
}
module.exports = { Store };
