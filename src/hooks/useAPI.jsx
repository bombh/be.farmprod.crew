import { useState, useEffect } from "react"
import axios from "axios"

const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL
const key = process.env.EXPO_PUBLIC_API_KEY

const useAPI = (method, endpoint, query) => {
   const [data, setData] = useState([])
   const [isLoading, setIsLoading] = useState(true)
   const [error, setError] = useState(null)

   console.log(`Render useApi ${baseUrl} ... loading`)
   const options = {
      method: method,
      url: `${baseUrl}${endpoint}/?key=${key}&${query ? query : ""}`,
      headers: {
         "Content-Type": "application/json",
      },
   }

   //console.log(`Render useApi ${options.url} ... loading`, isLoading)

   const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
         const result = await axios.request(options)
         setData(result.data)
         //console.log(result.data)
      } catch (error) {
         //console.log(error)
         setError(error)
         alert("Error fetching data, please try again later...")
      } finally {
         setIsLoading(false)
      }
   }

   useEffect(() => {
      fetchData()
   }, [])

   // const refetch = () => {
   //    //setIsLoading(true);
   //    fetchData();
   // }

   return { data, isLoading, error }
}

export default useAPI
