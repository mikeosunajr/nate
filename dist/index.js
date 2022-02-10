// binaryen.js
import binaryen from "https://cdn.jsdelivr.net/npm/binaryen@105.0.0/index.min.js";
var binaryen_default = binaryen;

// src/core.ts
var TNumber = class {
  constructor() {
    this.kind = 0 /* number */;
  }
};
var AddWord = class {
  constructor() {
    this.kind = 0 /* add */;
  }
};
var NumberWord = class {
  constructor(n) {
    this.kind = 1 /* number */;
    this.number = n;
  }
};
function Add() {
  return new AddWord();
}
function Number(n) {
  return new NumberWord(n);
}
function NumberT() {
  return new TNumber();
}

// src/index.ts
var memory = new WebAssembly.Memory({
  initial: 10,
  maximum: 100,
  shared: true
});
function compile(params, words) {
  var mod = new binaryen_default.Module();
  let topOfStack = params.length - 1;
  const incr = () => {
    topOfStack += 1;
    return;
  };
  const top = () => topOfStack;
  const expressions = words.map((word) => {
    switch (word.kind) {
      case 0 /* add */:
        const a = mod.local.get(top(), binaryen_default.i32);
        const b = mod.local.get(top() - 1, binaryen_default.i32);
        incr();
        return mod.local.set(top(), mod.i32.add(a, b));
      case 1 /* number */:
        incr();
        return mod.local.set(top(), mod.i32.const(word.number));
    }
  });
  console.log("return", top());
  mod.addFunction("run", binaryen_default.createType([binaryen_default.i32]), binaryen_default.i32, [binaryen_default.i32, binaryen_default.i32], mod.block(null, [
    ...expressions,
    mod.return(mod.local.get(top(), binaryen_default.i32))
  ]));
  mod.addFunctionExport("run", "run");
  mod.addMemoryImport("0", "env", "memory");
  mod.setMemory(1, 256, "memoryExport", [], true);
  mod.setFeatures(binaryen_default.Features.Atomics);
  var textData = mod.emitText();
  var wasmData = mod.emitBinary();
  return new WebAssembly.Module(wasmData);
}
var wasm = compile([NumberT()], [Number(3), Number(3), Add(), Add()]);
var instance = new WebAssembly.Instance(wasm, { env: { memory } });
console.log(instance.exports.run(400));
//# sourceMappingURL=index.js.map
