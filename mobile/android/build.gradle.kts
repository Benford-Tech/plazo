allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

// Plugins compiled with Kotlin (e.g. stripe_android) must target the same JVM as their Java
// sources (17), whatever JDK runs Gradle; otherwise Kotlin picks the running JDK's level.
subprojects {
    plugins.withId("org.jetbrains.kotlin.android") {
        tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile>().configureEach {
            compilerOptions.jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
        }
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}

// stripe_android's release lint pulls play-services-tapandpay, a Google artifact that is not
// published on public Maven repositories; the lint step is not needed for our builds.
subprojects {
    if (name == "stripe_android") {
        tasks.whenTaskAdded {
            if (this.name.startsWith("lintVital")) enabled = false
        }
    }
}
