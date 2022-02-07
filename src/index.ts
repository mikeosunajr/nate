import binaryen from "binaryen";
//import * as Core from './core'


// Create a module with a single function
var myModule = new binaryen.Module();

let memory = new WebAssembly.Memory({initial:10, maximum:100, shared:true});
const view = new Int32Array(memory.buffer);
view[0] = 3;

const add = myModule.i32.add(
    myModule.local.get(0, binaryen.i32),
    myModule.i32.load(0, 4, myModule.i32.const(0))
  )

myModule.addFunction("run", binaryen.createType([ binaryen.i32 ]), binaryen.i32, [ binaryen.i32 ],
  myModule.block(null, [
    myModule.local.set(1,
      add
    ),
    myModule.return(
      myModule.local.get(1, binaryen.i32)
    )
  ])
);

myModule.addFunctionExport("run", "run");
myModule.addMemoryImport("0", "env", "memory");
myModule.setMemory(1, 256, "memoryExport", [], true);
myModule.setFeatures(binaryen.Features.Atomics);

// Optimize the module using default passes and levels
myModule.optimize();

// // // Validate the module
if (!myModule.validate())
  throw new Error("validation error");

// // Generate text format and binary
var textData = myModule.emitText();
console.log(textData);
var wasmData = myModule.emitBinary();

// Example usage with the WebAssembly API
var compiled = new WebAssembly.Module(wasmData);
var instance = new WebAssembly.Instance(compiled, { env: { memory }});
console.log((instance.exports.run as CallableFunction)(400));

// function compile(words: Core.Word[]) {
//     words.
// }


// const addOne = compile([Core.Number(1), Core.Add()]);

// addOne(42); // => 43