# Only valid extensions are "firefox" and "chrome"
if [ -z "$1" ]; then
    echo "To package an extension you must supply an extension type."
    echo "    ./package.sh firefox"
    echo "    ./package.sh chrome"
    exit 1
fi

if [ $1 = "chrome" ] || [ $1 = "firefox" ]; then
    ./build-extension.sh $1
    cd dist/$1/ && zip -r -FS ../ydb-$1.zip *
else
    echo "Invalid extension type $1"
fi