/**
 * LoadingGate.jsx
 * Loading screen, then the content: <Loading> while loading or on error. Once the data is there, Loading slides out
 * first, then the content is mounted (its entry animations start then).
 * children: function returning the content, only called when the data is there
 */
import { useCallback, useState } from "react"
import Loading from "@/src/components/app/Loading"

const LoadingGate = ({ isLoading, isError, label, refetch, children }) => {
   const isWaiting = isLoading || isError
   const [isLoadingShown, setIsLoadingShown] = useState(isWaiting)

   // Back to loading (refetch...): the content is removed, Loading comes back
   if (isWaiting && !isLoadingShown) setIsLoadingShown(true)

   const onLeft = useCallback(() => setIsLoadingShown(false), [])

   if (isLoadingShown) {
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

   return children()
}

export default LoadingGate
