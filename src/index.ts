import binaryen from "binaryen";
import * as Core from "./core";
import { LocalStorage } from "node-localstorage";

const localStorage = new LocalStorage("./scratch");

let memory = new WebAssembly.Memory({
  initial: 10,
  maximum: 100,
  shared: true,
});

class Vocabulary {
  name: Map<number, string> = new Map();
  types: Map<string, Map<number, Core.Type>> = new Map();
  words: Map<string, Map<number, Core.Word>> = new Map();
}

function compile(words: Core.Word[]) {
  var mod = new binaryen.Module();

  const stack: Array<number> = [];

  let varId = 0;
  const use = () => {
    if (stack.length < 1) {
      throw new Error("popping empty stack");
    }
    return stack.pop() || 0;
  };
  const genvar = () => {
    stack.push(varId);
    varId += 1;
    return varId - 1;
  };

  const shape = words.reduce<{
    inputs: Array<Core.Type>;
    outputs: Array<Core.Type>;
    locals: Array<Core.Type>;
  }>(
    (p, w) => {
      w.inputs.forEach((i) => {
        if (p.outputs.length > 0) {
          p.outputs.pop();
        } else {
          p.inputs.push(i);
        }
      });

      w.outputs.forEach((o) => {
        p.outputs.push(o);
        p.locals.push(o);
      });
      return p;
    },
    { inputs: [], outputs: [], locals: [] }
  );

  console.log(shape);

  shape.inputs.forEach((p) => {
    genvar();
  });

  const expressions = words.map((word) => {
    switch (word.kind) {
      case Core.Kind.add:
        // return add of last 2 values of stack
        const a = mod.local.get(use(), binaryen.i32);
        const b = mod.local.get(use(), binaryen.i32);

        return mod.local.set(genvar(), mod.i32.add(a, b));
      case Core.Kind.number:
        // Push const value to stack
        return mod.local.set(genvar(), mod.i32.const(word.number));
    }
  });

  const varsToBinaryenTypes = (t: Array<Core.Type>) =>
    t.map((v) => binaryen.i32);

  mod.addFunction(
    "run",
    binaryen.createType(varsToBinaryenTypes(shape.inputs)),
    binaryen.i32,
    varsToBinaryenTypes(shape.locals),
    mod.block(null, [
      ...expressions,
      mod.return(mod.local.get(use(), binaryen.i32)),
    ])
  );

  mod.addFunctionExport("run", "run");
  mod.addMemoryImport("0", "env", "memory");
  mod.setMemory(1, 256, "memoryExport", [], true);
  mod.setFeatures(binaryen.Features.Atomics);

  // Optimize the module using default passes and levels
  mod.optimize();

  // // // Validate the module
  if (!mod.validate()) throw new Error("validation error");

  // // Generate text format and binary
  var textData = mod.emitText();
  console.log(textData);
  var wasmData = mod.emitBinary();

  // Example usage with the WebAssembly API
  return new WebAssembly.Module(wasmData);
}

const wasm = compile([
  Core.Number(3),
  Core.Number(3),
  Core.Add(),
  Core.Add(),
  Core.Number(3),
  Core.Add(),
]);

var instance = new WebAssembly.Instance(wasm, { env: { memory } });
console.log((instance.exports.run as CallableFunction)(1));

//addOne(42); // => 43
