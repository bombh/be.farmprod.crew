import { View, Text } from "react-native"
import React from "react"
import MapView, { PROVIDER_GOOGLE } from "react-native-maps"
import MapMarker from "./MapMarker"

const mapStyle = require("@/src/data/mapStyle.json")

const Map = ({ data, onMarkerPress }) => {
   return (
      <MapView
         className="flex-1"
         //provider={PROVIDER_GOOGLE}
         initialRegion={{
            latitude: data.param.mapCenter.lat,
            longitude: data.param.mapCenter.lng,
            latitudeDelta: data.param.delta,
            longitudeDelta: data.param.delta,
         }}
         customMapStyle={mapStyle}
         //showsUserLocation
         // showsMyLocationButton
      >
         {data.points.map((point, index) => (
            <MapMarker
               key={index}
               point={point}
               onPress={onMarkerPress}
            />
         ))}
      </MapView>
   )
}

export default Map
