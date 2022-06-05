import commonjs from "rollup-plugin-commonjs";
import sourceMaps from "rollup-plugin-sourcemaps";
import typescript from "rollup-plugin-typescript2";
import cleaner from "rollup-plugin-cleaner";
import resolve from "rollup-plugin-node-resolve";
import {terser} from "rollup-plugin-terser";

const pkg = require("./package.json");

export default {
    input: "src/index.ts",
    output: [
        {file: pkg.module, format: "es", sourcemap: "inline", plugins: [terser()]}
    ],
    external: [
        "rxjs",
        "rxjs/operators"
    ],
    watch: {
        include: "src/**"
    },
    plugins: [
        cleaner({
            targets: [
                "./dist/"
            ]
        }),
        // Compile TypeScript files
        typescript({
            tsconfig: "tsconfig.json",
            tsconfigOverride: {
                exclude: ["src/test/**/*"]
            }
        }),
        // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
        commonjs({
            include: "node_modules/**"
        }),
        // Resolve source maps to the original source
        sourceMaps(),
        // Allow node_modules resolution, so you can use 'external' to control
        // which external modules to include in the bundle
        // https://github.com/rollup/rollup-plugin-node-resolve#usage
        resolve()
    ]
};
