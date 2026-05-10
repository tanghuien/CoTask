## CoTask - Task Management App
These are the steps to run app on Xcode's stimulator and own iOS device.

### Phase 1: Prerequisites
Download Xcode from [app store](https://share.google/SU0qYHkDiBqV8tg5G) or [website](https://developer.apple.com/xcode/).
<br>
Ensure ruby, npm is already installed.

### Phase 2: Initialise React Native Project
Open your terminal and navigate to your desired working directory.
<br>
```npx @react-native-community/cli@latest init CoTask```
<br>
If asked to install cocoa pods, enter n

### Phase 3: Download necessary packages
Navigate to the working directory.
<br>
```cd cotask```
<br>
Download the neccessary packages.
<br>
```npm i react-native-worklets```
<br>
```npm install --save react-native-vector-icons```
<br>
```npm install react-native-reanimated react-native-gesture-handler react-native-screens```
<br>
```react-native-safe-area-context @react-native-community/masked-view```
<br>
```npm install @react-navigation/stack @react-navigation/native``` 
<br>
```npm install react-native-sqlite-storage```
<br>
```npm install react-native-ui-datepicker ```
<br>
```npm install react-native-select-dropdown``` 
<br>
```npm i @react-native-community/checkbox```
<br>
```npm i @react-native-async-storage/async-storage```
<br>
```npm i react-native-document-picker``` 
<br>
```npm i react-native-file-viewer```
<br>
```npm install --save @notifee/react-native```
<br>
```npm i react-native-gesture-handler ```
<br>
```npm i @testing-library/react-native```
<br>
To install the CocoaPods dependencies to link native modules and generate the .xcworkspace file.
<br>
```cd ios```
<br>
```pod install```

### Phase 3: Selective Checkout
Remove unnecessary file, and only work with specific files from remote repository.
<br>
```rm "App.tsx"```
<br>
```git init```
<br>
```git remote add origin https://github.com/tanghuien/CoTask```
<br>
```git fetch origin```
<br>
```git checkout origin/main -- App.tsx```
<br>
```git checkout origin/main -- pages```
<br>

```git checkout origin/main -- ios/CoTask/Images.xcassets```
<br>


### Phase 4: Set up assets 
Open white icon CoTask.xcworkspace in ios folder. 
<br>
To create custom assets 
<br>
Create new group called "Fonts"  add file into the group: node_module/react-native-vector-icons/Fonts/Octicons.ttf 
<br>

Click on Info at side bar 
<br>
Add Fonts provided by application(array) into information property list
<br>
Add Item 0: Octicons.ttf 
<br>

Remove Octicons.ttf from app > build phases > copy bundle resources. 
<br>

Update project dependencies:
<br>
```cd ios```
<br>
```pod install``` 

### Phase 5: Completion
Finally, launch the app by
<br>
Keeping the terminal open.
<br>
Type npm start and press Enter.
<br>
Leave the terminal window running in the background while running the stimulator in Xcode.
<br>

### Open the app in own device.
Targets > Signing & Capabilities > Team sign in
<br>
Use usb cable to connect phone and macbook
<br>
Open settings on Phone > Developer Mode > Switch on
<br>
Open settings on Phone > General > VPN & Device Management > Select the developer profile to trust the application source.




