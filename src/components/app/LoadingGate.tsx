/**
 * LoadingGate.tsx
 * Loading screen, then the content: <Loading> while loading or on error. Once the data is there, Loading slides out
 * first, then the content is mounted (its entry animations start then).
 * data: optional. When the prop is passed (even as undefined), undefined means the data is not there yet: Loading
 *   stays, like while loading or on error. Without the prop, only isLoading / isError are used (useInfiniteAPI lists).
 * children: function returning the content, called with the data, only when the data is there
 */
import { useCallback, useState } from "react"
import type { ReactNode } from "react"
import Loading from "@/src/components/app/Loading"

interface LoadingGateBaseProps {
   isLoading: boolean
   isError: boolean
   label?: string
   refetch?: () => unknown
}

// With data: children receives the loaded data. Without the data prop: children takes no argument
interface LoadingGateComponent {
   <T>(props: LoadingGateBaseProps & { data: T | undefined; children: (data: T) => ReactNode }): ReactNode
   (props: LoadingGateBaseProps & { data?: never; children: () => ReactNode }): ReactNode
}

// children is a method (bivariant) so that both forms above are assignable to the implementation
const LoadingGate: LoadingGateComponent = ({
   isLoading,
   isError,
   label,
   refetch,
   children,
   ...props
}: LoadingGateBaseProps & { data?: unknown; children(data?: unknown): ReactNode }) => {
   const { data } = props
   const isWaiting = isLoading || isError || ("data" in props && data === undefined)
   const [isLoadingShown, setIsLoadingShown] = useState(isWaiting)

   // Back to loading (refetch...): the content is removed, Loading comes back
   if (isWaiting && !isLoadingShown) setIsLoadingShown(true)

   const onLeft = useCallback(() => setIsLoadingShown(false), [])

   // isWaiting too: in the render that sets isLoadingShown above, children must not run without the data
   // (that render is discarded, but its output is computed)
   if (isLoadingShown || isWaiting) {
      return (
         <Loading
            label={label}
            isError={isError}
            refetch={refetch}
            isLeaving={!isWaiting}
            onLeft={onLeft}
         />
      )
   }

   return children(data)
}

export default LoadingGate
