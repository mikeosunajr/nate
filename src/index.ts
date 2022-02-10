import binaryen from "binaryen";
import * as Core from "./core";

let memory = new WebAssembly.Memory({
  initial: 10,
  maximum: 100,
  shared: true,
});

function compile(params: Core.Type[], words: Core.Word[]) {
  var mod = new binaryen.Module();

  let topOfStack = params.length - 1;
  const incr = () => {
    topOfStack += 1;
    return;
  };

  const top = () => topOfStack;

  const expressions = words.map((word) => {
    switch (word.kind) {
      case Core.Kind.add:
        // return add of last 2 values of stack
        const a = mod.local.get(top(), binaryen.i32);
        const b = mod.local.get(top() - 1, binaryen.i32);

        incr();
        return mod.local.set(top(), mod.i32.add(a, b));
      case Core.Kind.number:
        // Push const value to stack
        incr();

        return mod.local.set(top(), mod.i32.const(word.number));
    }
  });

  console.log("return", top());

  mod.addFunction(
    "run",
    binaryen.createType([binaryen.i32]),
    binaryen.i32,
    [binaryen.i32, binaryen.i32],
    mod.block(null, [
      ...expressions,
      mod.return(mod.local.get(top(), binaryen.i32)),
    ])
  );

  mod.addFunctionExport("run", "run");
  mod.addMemoryImport("0", "env", "memory");
  mod.setMemory(1, 256, "memoryExport", [], true);
  mod.setFeatures(binaryen.Features.Atomics);

  // Optimize the module using default passes and levels
  //mod.optimize();

  // // // Validate the module
  // if (!mod.validate()) throw new Error("validation error");

  // // Generate text format and binary
  var textData = mod.emitText();
  // console.log(textData);
  var wasmData = mod.emitBinary();

  // Example usage with the WebAssembly API
  return new WebAssembly.Module(wasmData);
}

const wasm = compile(
  [Core.NumberT()],
  [Core.Number(3), Core.Number(3), Core.Add(), Core.Add()]
);

var instance = new WebAssembly.Instance(wasm, { env: { memory } });
console.log((instance.exports.run as CallableFunction)(400));

//addOne(42); // => 43
