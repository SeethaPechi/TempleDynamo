@echo off
REM Build Frontend Assets for TamilKovil Production

echo ============================================
echo Building TamilKovil Frontend Assets
echo ============================================

cd "C:\inetpub\TestKovil"
echo Current directory: %CD%

REM Step 1: Check if we have source files
echo Checking for source files...
if exist "client" (
    echo ✅ Found client directory
) else if exist "src" (
    echo ✅ Found src directory
) else (
    echo ❌ No frontend source directory found
    echo Available directories:
    dir /b
    goto :error
)

REM Step 2: Install frontend dependencies
echo Installing frontend dependencies...
if exist "package.json" (
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ npm install failed
        goto :error
    )
) else (
    echo ❌ No package.json found
    goto :error
)

REM Step 3: Build frontend assets
echo Building frontend for production...
if exist "vite.config.ts" (
    echo Running Vite build...
    npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Vite build failed
        echo Trying alternative build command...
        npx vite build
    )
) else if exist "webpack.config.js" (
    echo Running Webpack build...
    npm run build
) else (
    echo No build configuration found, trying generic build...
    npm run build
)

REM Step 4: Check build output
echo Checking build output...
if exist "dist" (
    echo ✅ Found dist directory
    echo Build contents:
    dir dist /s /b
) else if exist "build" (
    echo ✅ Found build directory
    echo Build contents:
    dir build /s /b
) else (
    echo ❌ No build output found
    echo Available directories after build:
    dir /b
    goto :error
)

REM Step 5: Copy build files to public
echo Copying build files to public directory...
if exist "dist" (
    if not exist "public" mkdir public
    echo Copying from dist to public...
    xcopy dist\* public\ /s /e /y
    echo ✅ Files copied from dist to public
) else if exist "build" (
    if not exist "public" mkdir public
    echo Copying from build to public...
    xcopy build\* public\ /s /e /y
    echo ✅ Files copied from build to public
)

REM Step 6: Create production index.html if missing
if not exist "public\index.html" (
    echo Creating production index.html...
    (
        echo ^<!DOCTYPE html^>
        echo ^<html lang="en"^>
        echo ^<head^>
        echo ^<meta charset="UTF-8"^>
        echo ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
        echo ^<title^>Tamil Kovil - Temple Management System^</title^>
        echo ^<link rel="stylesheet" href="/assets/index.css"^>
        echo ^</head^>
        echo ^<body^>
        echo ^<div id="root"^>^</div^>
        echo ^<script src="/assets/index.js"^>^</script^>
        echo ^</body^>
        echo ^</html^>
    ) > public\index.html
    echo ✅ Production index.html created
)

REM Step 7: Update server.js to serve static files correctly
echo Updating server.js for production static files...
if exist "server.js" (
    powershell -Command ^
    "$content = Get-Content 'server.js' -Raw; ^
    if ($content -notmatch 'app\.use.*express\.static') { ^
        $content = $content -replace '(const app = express\(\);)', '$1`napp.use(express.static(\"public\"));'; ^
        Set-Content 'server.js' $content ^
    }"
    echo ✅ Server updated for static file serving
)

echo.
echo ============================================
echo Build Complete
echo ============================================
echo.
echo Frontend assets built and deployed to public directory
echo Server configured to serve static files
echo.
echo Test the application:
echo http://tamilkovil.com:8080/
echo.
goto :end

:error
echo.
echo ============================================
echo Build Failed
echo ============================================
echo.
echo Frontend build process encountered errors.
echo Please check:
echo 1. Source files are present
echo 2. package.json has build script
echo 3. Node.js and npm are working
echo.

:end
pause