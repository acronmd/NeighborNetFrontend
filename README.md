# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npx expo install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## To run NeighborNet, please ensure the database is live at either https://register.acrn.me, or a similar https protected domain

## To make changes to the running backend, please check 
### 'app/lib/config.ts'
     "export const BASE_URL = "new_https_backend_url";"

## To ensure Google Maps API works (Required for many app functions), please ensure you're testing with Expo Go, or providing your own Google Maps API Key in
###     "app.json"
      "expo" : {
         "android" : {
            "config": {
               "googleMaps": {
                  "apiKey": "ENTER_API_KEY_HERE"
               }
            },
         },
      }
      

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).


This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
