/**
 * LoadingGate.tsx
 *
 * Loading screen, then the content: <Loading> while loading or on error. Once the data is there, Loading slides out
 * first, then the content is mounted (its entry animations start then). Used by nearly every data screen (works list,
 * artists, tours, tour detail, work detail, about, 20 years) to avoid repeating loading / error handling.
 *
 * Props:
 * - isLoading / isError / refetch / label: from the data hook ({ isLoading, isError, refetch } of useAPI / useFetch).
 * - data: optional. When the prop is passed (even as undefined), undefined means the data is not there yet: Loading
 *   stays, like while loading or on error. Without the prop, only isLoading / isError are used (useInfiniteAPI lists).
 * - children: function returning the content, called with the data, only when the data is there
 *
 * How it works: `isWaiting` = still loading, in error, or data prop undefined. `isLoadingShown` keeps <Loading> mounted
 * after the data arrived, so it can play its exit animation (isLeaving); its onLeft callback then flips
 * isLoadingShown to false and the children render. If the screen goes back to waiting (refetch...), Loading returns
 * immediately (state adjusted during render). Typed with two call signatures so `children` gets a typed `data`.
 * Unit tested in components/app/__tests__/LoadingGate.test.tsx.
 */
import { useCallback, useState } from "react" // Stable onLeft callback, loading-shown state
import type { ReactNode } from "react" // Children / return type
import Loading from "@/src/components/app/Loading" // Placeholder with enter / exit animation

// Props shared by both forms
interface LoadingGateBaseProps {
   // Query is loading with nothing to show
   isLoading: boolean
   // Query failed with nothing to show
   isError: boolean
   // Text under the spinner
   label?: string
   // Try again handler
   refetch?: () => unknown
}

// With data: children receives the loaded data. Without the data prop: children takes no argument
// Overloads: data form (typed data given to children) and no-data form
interface LoadingGateComponent {
   <T>(props: LoadingGateBaseProps & { data: T | undefined; children: (data: T) => ReactNode }): ReactNode
   (props: LoadingGateBaseProps & { data?: never; children: () => ReactNode }): ReactNode
}

// children is a method (bivariant) so that both forms above are assignable to the implementation
// Implementation signature; see header
const LoadingGate: LoadingGateComponent = ({
   isLoading,
   isError,
   label,
   refetch,
   children,
   ...props
}: LoadingGateBaseProps & { data?: unknown; children(data?: unknown): ReactNode }) => {
   // Loaded data (when the prop is given)
   const { data } = props
   // True while Loading must be shown: loading, error, or data prop present but undefined
   const isWaiting = isLoading || isError || ("data" in props && data === undefined)
   // Keeps <Loading> mounted until its exit animation is done
   const [isLoadingShown, setIsLoadingShown] = useState(isWaiting)

   // Back to loading (refetch...): the content is removed, Loading comes back
   if (isWaiting && !isLoadingShown) setIsLoadingShown(true)

   // Called by Loading after its exit animation: now the content can mount
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

   // Data is there and Loading is gone: render the content
   return children(data)
}

export default LoadingGate
