/**
 * share.ts
 *
 * Wrapper around the native share sheet (React Native `Share`), used to share the link of a work from the Work detail
 * screen (screens/WorkDetail.tsx, header share button).
 *
 * `shareLink(title, url, dialogTitle?)` opens the OS share sheet. Platform difference handled here: iOS accepts a
 * separate `message` and `url`, whereas Android only shares `message`, so the url is appended to it on a new line.
 * Errors (including the user dismissing the sheet) are swallowed on purpose.
 */

import { Platform, Share } from "react-native" // Platform.OS to branch iOS / Android; Share = native share sheet

// iOS shares message + url separately, Android only shares the message
// Opens the share sheet. title = shared text, url = link to share, dialogTitle = Android sheet title
export const shareLink = (title: string, url: string, dialogTitle = "Share") => {
   // What is shared: iOS keeps message and url apart, Android needs the url inside the message
   const content = Platform.OS === "ios" ? { message: title, url } : { title, message: `${title}\n${url}` }
   // subject = email subject when the user picks a mail app; the rejection is ignored (dismissed sheet)
   Share.share(content, { dialogTitle, subject: title }).catch(() => {})
}
