/* global describe, it, expect, jest, beforeEach */
// These tests use react-test-renderer with small query helpers (no @testing-library/react-native).
import { act, create } from "react-test-renderer"
import { Linking } from "react-native"
import RenderHtml from "@/src/components/app/RenderHtml"

let renderer

const render = async (element) => {
   await act(async () => {
      renderer = create(element)
   })
}

const textOf = (node) =>
   typeof node === "string" ? node : (node.children ?? []).map((child) => textOf(child)).join("")

// Host <Text> nodes (only the outermost ones, to avoid nested duplicates)
const getTexts = () =>
   renderer.root
      .findAll((node) => node.type === "Text")
      .filter((node) => node.parent?.type !== "Text")
      .map((node) => textOf(node))

const screen = {
   getByText: (text) => {
      const found = getTexts().filter((value) => value === text)
      if (found.length !== 1) throw new Error(`Expected one text "${text}", found ${found.length}: ${getTexts()}`)
      return found[0]
   },
   getAllByTestId: (testID) => renderer.root.findAll((node) => node.type === "View" && node.props.testID === testID),
   queryByTestId: (testID) => screen.getAllByTestId(testID)[0] ?? null,
   getAllByLabelText: (label) =>
      renderer.root.findAll(
         (node) => node.props.accessibilityLabel === label && typeof node.props.onPress === "function",
      ),
   getByLabelText: (label) => {
      const found = screen.getAllByLabelText(label)
      if (!found.length) throw new Error(`No pressable with label "${label}"`)
      return found[0]
   },
}

const fireEvent = {
   press: (node) => act(() => node.props.onPress()),
}

const mockNavigate = jest.fn()

jest.mock("expo-router", () => ({
   useRouter: () => ({ navigate: mockNavigate }),
}))

jest.mock("expo-image", () => {
   const { View } = require("react-native")
   const Image = (props) => (
      <View
         testID="expo-image"
         {...props}
      />
   )
   // Gallery preload on image press
   Image.prefetch = jest.fn(() => Promise.resolve(true))
   return { Image }
})

const BASE = "https://www.farmprod.be/content/images"

const html =
   '<p>Painted by <a href="https://farmprod.be">Farm Prod</a> &amp; friends.</p>' +
   `<figure class="kg-card kg-image-card"><img src="${BASE}/2023/05/wall.jpg" class="kg-image" alt="" srcset="${BASE}/size/w600/2023/05/wall.jpg 600w"></figure>` +
   '<h2 id="details">Details</h2>' +
   '<h3 id="sub">Sub title</h3>' +
   "<ul><li>Spray</li></ul><ol><li>First</li></ol>" +
   `<figure class="kg-card kg-image-card"><img src="${BASE}/2023/05/detail.jpg"></figure>`

describe("RenderHtml", () => {
   beforeEach(() => {
      mockNavigate.mockClear()
   })

   it("renders paragraphs, headings, list items and images", async () => {
      await render(<RenderHtml html={html} />)

      expect(screen.getByText("Painted by Farm Prod & friends.")).toBeTruthy()
      expect(screen.getByText("Details")).toBeTruthy()
      expect(screen.getByText("Sub title")).toBeTruthy()
      expect(screen.getByText("• Spray")).toBeTruthy()
      expect(screen.getByText("1. First")).toBeTruthy()

      const images = screen.getAllByTestId("expo-image")
      expect(images).toHaveLength(2)
      expect(images[0].props.source).toEqual({ uri: `${BASE}/size/w600/2023/05/wall.jpg` })
   })

   it("opens the gallery at the pressed image", async () => {
      await render(
         <RenderHtml
            html={html}
            gallery
         />,
      )

      const button = screen.getByLabelText("Open picture 2 of 2 in full screen")
      expect(button.props.accessibilityRole).toBe("button")

      await fireEvent.press(button)

      expect(mockNavigate).toHaveBeenCalledWith({
         pathname: "works/pictures",
         params: {
            index: 1,
            images: [`${BASE}/size/w1600/2023/05/wall.jpg`, `${BASE}/size/w1600/2023/05/detail.jpg`],
         },
      })
   })

   it("does not navigate when the gallery is disabled", async () => {
      await render(<RenderHtml html={html} />)

      expect(screen.getAllByLabelText("Picture")[0].props.disabled).toBe(true)

      expect(mockNavigate).not.toHaveBeenCalled()
   })

   it("renders the artists and an accessible email button", async () => {
      const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true)

      await render(
         <RenderHtml
            html="<p>Text</p>"
            authors={[{ name: "Ozie" }, { name: "Nean" }]}
            email="hello@example.com"
         />,
      )

      expect(screen.getByText("Artists")).toBeTruthy()
      expect(screen.getByText("Ozie / Nean")).toBeTruthy()

      await fireEvent.press(screen.getByLabelText("Send an email to hello@example.com"))
      expect(openURL).toHaveBeenCalledWith("mailto:hello@example.com")

      openURL.mockRestore()
   })

   it("renders the bands and the email button at rest with reveal outside a ParallaxScrollView", async () => {
      await render(
         <RenderHtml
            html={html}
            authors={[{ name: "Ozie" }]}
            email="hello@example.com"
            reveal
         />,
      )

      expect(screen.getByText("Details")).toBeTruthy()
      expect(screen.getByText("Artists")).toBeTruthy()
      expect(screen.getByLabelText("Send an email to hello@example.com")).toBeTruthy()
   })

   it("renders nothing for empty html", async () => {
      await render(<RenderHtml html="" />)

      expect(screen.queryByTestId("expo-image")).toBeNull()
      expect(getTexts()).toEqual([])
   })
})
