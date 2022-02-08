// binaryen.js
import binaryen from "https://cdn.jsdelivr.net/npm/binaryen@105.0.0/index.min.js";
var binaryen_default = binaryen;

// src/core.ts
var TNumber = class {
  constructor() {
    this.kind = 0 /* number */;
  }
};
var NumberWord = class {
  constructor(n) {
    this.kind = 1 /* number */;
    this.number = n;
  }
};
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
  const decr = () => {
    topOfStack -= 1;
    return;
  };
  const incr = () => {
    topOfStack += 1;
    return;
  };
  const top = () => topOfStack;
  const expressions = words.map((word) => {
    switch (word.kind) {
      case 0 /* add */:
        console.log("add: get", top());
        const a = mod.local.get(top(), binaryen_default.i32);
        console.log("add: get", top() - 1);
        const b = mod.local.get(top() - 1, binaryen_default.i32);
        incr();
        console.log("add: set", top());
        return mod.local.set(top(), mod.i32.add(a, b));
      case 1 /* number */:
        incr();
        console.log("number: set", top());
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
  if (!mod.validate())
    throw new Error("validation error");
  return;
}
var wasm = compile([NumberT()], [Number(3), Number(3)]);
