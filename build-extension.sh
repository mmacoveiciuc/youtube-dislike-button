# Only valid extensions are "firefox" and "chrome"
if [ -z "$1" ]; then
    echo "To build an extension you must supply an extension type."
    echo "    ./build-extension.sh firefox"
    echo "    ./build-extension.sh chrome"
    exit 1
fi

echo "Building extension for $1 ..."
# Make sure the dist directory exists
mkdir -p dist

# Package the chrome extension
if [ $1 = "chrome" ]; then
    mkdir -p dist/chrome
    rm -rf dist/chrome/**
    cp -R common/* dist/chrome
    cp -R chrome/* dist/chrome
    echo "OK"
    exit 0
fi

# Package the firefox extension
if [ $1 = "firefox" ]; then
    mkdir -p dist/firefox
    rm -rf dist/firefox/**
    cp -R common/* dist/firefox
    cp -R firefox/* dist/firefox
    echo "OK"
    exit 0
fi

echo "Invalid extension type: $1"
