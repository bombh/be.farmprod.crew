/* global describe, it, expect */
import { act, create } from "react-test-renderer"
import { Text } from "react-native"
import LoadingGate from "@/src/components/app/LoadingGate"

const textsOf = (renderer) =>
   renderer.root
      .findAll((node) => node.type === "Text")
      .filter((node) => node.parent?.type !== "Text")
      .map((node) => [].concat(node.props.children).join(""))

const render = async (props) => {
   let renderer
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
})
