import { Platform, Share } from "react-native"

// iOS shares message + url separately, Android only shares the message
export const shareLink = (title: string, url: string, dialogTitle = "Share") => {
   const content = Platform.OS === "ios" ? { message: title, url } : { title, message: `${title}\n${url}` }
   Share.share(content, { dialogTitle, subject: title }).catch(() => {})
}
