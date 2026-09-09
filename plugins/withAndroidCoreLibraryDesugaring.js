const {
  withAppBuildGradle,
} = require(
  "expo/config-plugins",
);

const marker =
  "// catudrive-sunmi-core-library-desugaring";

const desugarJdkLibsVersion =
  "2.1.5";

/*
|--------------------------------------------------------------------------
| ANDROID 7.x / SUNMI V2 PRO
|--------------------------------------------------------------------------
|
| SUNMI V2 PRO commonly runs Android 7.1.
|
| Expo development launcher uses java.time APIs that are unavailable on
| Android 7.x without core library desugaring.
|
| Keep this as an Expo config plugin. Do not edit generated android/app
| build.gradle manually because prebuild --clean can replace it.
|
*/

const withAndroidCoreLibraryDesugaring =
  (
    config,
  ) =>
    withAppBuildGradle(
      config,
      (
        androidConfig,
      ) => {
        if (
          androidConfig
            .modResults
            .language !==
          "groovy"
        ) {
          throw new Error(
            "Android app build.gradle must use Groovy",
          );
        }

        if (
          !androidConfig
            .modResults
            .contents
            .includes(
              marker,
            )
        ) {
          androidConfig.modResults.contents +=
            `

${marker}
android {
  compileOptions {
    coreLibraryDesugaringEnabled true
  }
}

dependencies {
  coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:${desugarJdkLibsVersion}")
}
`;
        }

        return androidConfig;
      },
    );

module.exports =
  withAndroidCoreLibraryDesugaring;
