const {join, resolve} = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin").CleanWebpackPlugin;

const locals = {
    devServer: {
        static: {
            directory: join(__dirname, "dist"),
        },
        port: 4200,
    },
    IS_DEV: process.env.NODE_ENV === "development",
    PATHS: {
        root: resolve(__dirname)
    }
};

const entry = {
    index: "./src/index.ts"
};

const externals = {};

const plugins = [
    new CleanWebpackPlugin({
        cleanStaleWebpackAssets: false, // resolve conflict with `CopyWebpackPlugin`
    })
];

if (locals.IS_DEV) {
    plugins.push(
        new CopyPlugin({
            patterns: [
                {from: "./src/test/*.html", to: "./[name][ext]"}
            ]
        })
    );
    entry.page = "./src/test/page.ts";
}
else {
    externals.rxjs = "rxjs";
}

module.exports = {
    // devtool: "eval-source-map",
    devtool: "source-map",
    target: "web",
    devServer: locals.IS_DEV ? locals.devServer : void 0,
    entry,
    plugins,
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },
    output: {
        filename: "[name].js",
        path: resolve(__dirname, "dist")
    },
    externals
};

