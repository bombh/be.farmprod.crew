import { useState, useEffect } from "react"
import axios from "axios"

const baseUrl = "https://map.farmprod.be/street-art-map-olln/public/"

const useFetch = (endpoint) => {
   const [data, setData] = useState({})
   const [isLoading, setIsLoading] = useState(true)
   const [error, setError] = useState(null)
   const [isError, setIsError] = useState(false)

   const options = {
      method: "GET",
      url: `${baseUrl}${endpoint}`,
      headers: {
         "Content-Type": "application/json",
      },
   }

   //console.log(`Render useFetch ${options.url} ... loading`, isLoading)

   const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      setIsError(false)

      try {
         const result = await axios.request(options)
         setData(result.data)
         //console.log("useFetch", result.data)
      } catch (error) {
         //console.log(error)
         setError(error)
         setIsError(true)
         //alert("Error fetching data, please try again later...")
      } finally {
         setIsLoading(false)
      }
   }

   useEffect(() => {
      fetchData()
   }, [])

   const refetch = () => {
      setIsLoading(true)
      setIsError(false)
      fetchData()
   }

   return { data, isLoading, error, isError, refetch }
}

export default useFetch
