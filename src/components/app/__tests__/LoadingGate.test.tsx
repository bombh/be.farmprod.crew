/**
 * LoadingGate.test.tsx
 *
 * Jest tests (jest-expo preset, react-test-renderer, no testing-library) of components/app/LoadingGate.tsx.
 * Reanimated runs with its Jest setup (jest-setup.js), so the exit animation of <Loading> really plays and the tests
 * advance it with act().
 * Cases covered:
 * - content shown right away when the data is already there;
 * - Loading (and not the content) while loading;
 * - Loading stays while its exit animation plays, then the content is shown;
 * - Loading stays while the `data` prop is undefined even if isLoading / isError are false;
 * - children receives the loaded data once it is there;
 * - children is never called without the data when loading comes back while the content is shown.
 * Helpers: `textsOf` lists the rendered texts, `render` mounts a gate whose content is the text "Content".
 */

/* global describe, it, expect, jest */
import { act, create } from "react-test-renderer" // act: flush updates and animations; create: render to a test tree
import type { ReactTestRenderer } from "react-test-renderer" // Type of the test renderer
import { Text } from "react-native" // Content / text nodes
import LoadingGate from "@/src/components/app/LoadingGate" // Component under test

// The part of a test instance read here (its type is an element type, a string for host components)
interface TestNode {
   // Element type ("Text" string for host text)
   type: unknown
   // Props of the node (only children is read)
   props: { children?: unknown }
   // Parent node, used to skip nested Text
   parent: TestNode | null
}

// Texts of the outermost <Text> nodes of the tree, as strings
const textsOf = (renderer: ReactTestRenderer) =>
   renderer.root
      .findAll((node: TestNode) => node.type === "Text")
      .filter((node: TestNode) => node.parent?.type !== "Text")
      .map((node: TestNode) => ([] as unknown[]).concat(node.props.children).join(""))

// Mounts a LoadingGate with the given loading / error flags and waits for effects
const render = async (props: { isLoading: boolean; isError: boolean }) => {
   // Filled inside act
   let renderer!: ReactTestRenderer
   await act(async () => {
      renderer = create(
         <LoadingGate
            label="Loading Works"
            refetch={() => {}}
            {...props}
         >
            {() => <Text>Content</Text>}
         </LoadingGate>,
      )
   })
   return renderer
}

// LoadingGate behavior
describe("LoadingGate", () => {
   it("shows the content right away when the data is already there", async () => {
      const renderer = await render({ isLoading: false, isError: false })
      expect(textsOf(renderer)).toEqual(["Content"])
   })

   it("shows Loading, not the content, while loading", async () => {
      const renderer = await render({ isLoading: true, isError: false })
      const texts = textsOf(renderer)
      expect(texts).toContain("Loading Works")
      expect(texts).not.toContain("Content")
   })

   it("keeps Loading while its exit plays, then shows the content", async () => {
      const renderer = await render({ isLoading: true, isError: false })
      await act(async () => {
         renderer.update(
            <LoadingGate
               label="Loading Works"
               isLoading={false}
               isError={false}
               refetch={() => {}}
            >
               {() => <Text>Content</Text>}
            </LoadingGate>,
         )
      })
      // Exit in progress: the content is not mounted yet
      expect(textsOf(renderer)).not.toContain("Content")

      await act(async () => {
         await new Promise((resolve) => setTimeout(resolve, 600))
      })
      expect(textsOf(renderer)).toEqual(["Content"])
   })

   it("keeps Loading while the data prop is undefined, even if isLoading and isError are false", async () => {
      const children = jest.fn(() => <Text>Content</Text>)
      let renderer!: ReactTestRenderer
      await act(async () => {
         renderer = create(
            <LoadingGate
               label="Loading Works"
               isLoading={false}
               isError={false}
               refetch={() => {}}
               data={undefined}
            >
               {children}
            </LoadingGate>,
         )
      })
      expect(textsOf(renderer)).toContain("Loading Works")
      expect(children).not.toHaveBeenCalled()
   })

   it("calls children with the data once it is there", async () => {
      const children = jest.fn((data: { title: string }) => <Text>{data.title}</Text>)
      const element = (data?: { title: string }) => (
         <LoadingGate
            label="Loading Works"
            isLoading={!data}
            isError={false}
            refetch={() => {}}
            data={data}
         >
            {children}
         </LoadingGate>
      )
      let renderer!: ReactTestRenderer
      await act(async () => {
         renderer = create(element(undefined))
      })
      expect(children).not.toHaveBeenCalled()

      await act(async () => {
         renderer.update(element({ title: "Loaded" }))
      })
      await act(async () => {
         await new Promise((resolve) => setTimeout(resolve, 600))
      })
      expect(textsOf(renderer)).toEqual(["Loaded"])
      expect(children).toHaveBeenCalledWith({ title: "Loaded" })
      children.mock.calls.forEach(([data]) => expect(data).toBeDefined())
   })

   it("never calls children without the data when loading comes back while the content is shown", async () => {
      const children = jest.fn((data: { title: string }) => <Text>{data.title}</Text>)
      const element = (data?: { title: string }) => (
         <LoadingGate
            label="Loading Works"
            isLoading={!data}
            isError={false}
            refetch={() => {}}
            data={data}
         >
            {children}
         </LoadingGate>
      )
      let renderer!: ReactTestRenderer
      await act(async () => {
         renderer = create(element({ title: "Loaded" }))
      })
      expect(textsOf(renderer)).toEqual(["Loaded"])

      // The data disappears (new query key, cleared cache...): Loading comes back, children is not called again
      await act(async () => {
         renderer.update(element(undefined))
      })
      expect(textsOf(renderer)).toContain("Loading Works")
      children.mock.calls.forEach(([data]) => expect(data).toBeDefined())
   })
})
