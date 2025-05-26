// utils/firebaseErrors.ts
export function getFriendlyFirebaseError(error: any): string {
    if (!error || !error.code) return "Something went wrong. Please try again.";
    switch (error.code) {
      case "auth/invalid-email":
        return "The email address is invalid.";
      case "auth/user-disabled":
        return "This account has been disabled. Please contact support.";
      case "auth/user-not-found":
        return "No account found with this email.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again.";
      case "auth/email-already-in-use":
        return "This email address is already in use.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/invalid-credential":
        return "Invalid login credentials.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait and try again later.";
      // Add more as needed
      default:
        return error.message?.replace(/^Firebase: |\(auth\/.*\)\.?$/g, '').trim() ||
          "An unknown error occurred. Please try again.";
    }
  }
  