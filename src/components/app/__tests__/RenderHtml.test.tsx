/**
 * RenderHtml.test.tsx
 *
 * Jest tests (jest-expo preset) of components/app/RenderHtml.tsx, with react-test-renderer and small query helpers
 * (`screen`, `fireEvent`) defined here instead of @testing-library/react-native.
 * Mocks: `expo-router` (useRouter().navigate is a jest.fn to check the gallery navigation) and `expo-image` (a plain
 * View with testID "expo-image" + a mocked Image.prefetch).
 * Cases covered:
 * - paragraphs, headings, list items (bullet / numbered) and images are rendered from a Ghost HTML fixture;
 * - pressing an image opens the gallery at that image (route params index + images) and prefetches pictures;
 * - no navigation when `gallery` is false;
 * - authors ("Artists") and an accessible email button are rendered;
 * - with `reveal` outside a ParallaxScrollView, bands and the button render at rest;
 * - empty html renders nothing.
 */

/* global describe, it, expect, jest, beforeEach */
// These tests use react-test-renderer with small query helpers (no @testing-library/react-native).
import { act, create } from "react-test-renderer" // act: flush updates; create: render to a test tree
import type { ReactTestRenderer } from "react-test-renderer" // Type of the test renderer
import { Linking } from "react-native" // Native linking module (the email button opens a mailto URL)
import RenderHtml from "@/src/components/app/RenderHtml" // Component under test

// The part of a test instance read here (its type is an element type, a string for host components)
interface TestNode {
   // Element type ("View" / "Text" strings for host components)
   type: unknown
   // Props read by the helpers
   props: { testID?: string; accessibilityLabel?: string; onPress?: () => void; children?: unknown }
   // Parent node
   parent: TestNode | null
   // Child nodes or text strings
   children: (TestNode | string)[]
}

// Current renderer, set by render()
let renderer: ReactTestRenderer

// Mounts an element and waits for effects
const render = async (element: Parameters<typeof create>[0]) => {
   await act(async () => {
      renderer = create(element)
   })
}

// Concatenated text of a node
const textOf = (node: TestNode | string): string =>
   typeof node === "string" ? node : (node.children ?? []).map((child) => textOf(child)).join("")

// Host <Text> nodes (only the outermost ones, to avoid nested duplicates)
const getTexts = () =>
   renderer.root
      .findAll((node: TestNode) => node.type === "Text")
      .filter((node: TestNode) => node.parent?.type !== "Text")
      .map((node: TestNode) => textOf(node))

// Minimal testing-library-like queries on the current renderer
const screen = {
   // Single text equal to the argument, throws otherwise
   getByText: (text: string) => {
      const found = getTexts().filter((value) => value === text)
      if (found.length !== 1) throw new Error(`Expected one text "${text}", found ${found.length}: ${getTexts()}`)
      return found[0]
   },
   // View nodes with this testID
   getAllByTestId: (testID: string) =>
      renderer.root.findAll((node: TestNode) => node.type === "View" && node.props.testID === testID),
   // First match or null
   queryByTestId: (testID: string) => screen.getAllByTestId(testID)[0] ?? null,
   // Pressable nodes (with onPress) having this accessibilityLabel
   getAllByLabelText: (label: string) =>
      renderer.root.findAll(
         (node: TestNode) => node.props.accessibilityLabel === label && typeof node.props.onPress === "function",
      ),
   // First pressable with the label, throws if none
   getByLabelText: (label: string) => {
      const found = screen.getAllByLabelText(label)
      if (!found.length) throw new Error(`No pressable with label "${label}"`)
      return found[0]
   },
}

// Minimal event helper
const fireEvent = {
   // Calls onPress inside act
   press: (node: TestNode) => act(() => node.props.onPress!()),
}

// Spy for router.navigate
const mockNavigate = jest.fn()

// Only useRouter is needed by RenderHtml
jest.mock("expo-router", () => ({
   useRouter: () => ({ navigate: mockNavigate }),
}))

// Image replaced by a View so props can be inspected
jest.mock("expo-image", () => {
   // A jest.mock factory runs before the imports: react-native has to be required inside it
   // eslint-disable-next-line @typescript-eslint/no-require-imports
   const { View } = require("react-native")
   const Image = (props: Record<string, unknown>) => (
      <View
         testID="expo-image"
         {...props}
      />
   )
   // Gallery preload on image press
   Image.prefetch = jest.fn(() => Promise.resolve(true))
   return { Image }
})

// Base URL of the Ghost images in the fixture
const BASE = "https://www.farmprod.be/content/images"

// Ghost-like content: paragraph with link and entity, image card, h2, h3, ul, ol, second image
const html =
   '<p>Painted by <a href="https://farmprod.be">Farm Prod</a> &amp; friends.</p>' +
   `<figure class="kg-card kg-image-card"><img src="${BASE}/2023/05/wall.jpg" class="kg-image" alt="" srcset="${BASE}/size/w600/2023/05/wall.jpg 600w"></figure>` +
   '<h2 id="details">Details</h2>' +
   '<h3 id="sub">Sub title</h3>' +
   "<ul><li>Spray</li></ul><ol><li>First</li></ol>" +
   `<figure class="kg-card kg-image-card"><img src="${BASE}/2023/05/detail.jpg"></figure>`

// RenderHtml rendering and interactions
describe("RenderHtml", () => {
   // Reset the navigation spy between tests
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
         pathname: "/works/pictures",
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
      const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined)

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
