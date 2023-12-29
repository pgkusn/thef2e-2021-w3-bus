export interface ApiCityList {
  CityID: string
  CityName: string
  CityCode: string
  City: string
  CountyID: string
  Version: string
}

export interface ApiRouteList {
  RouteUID: string
  RouteID: string
  HasSubRoutes: boolean
  Operators: Operator[]
  AuthorityID: string
  ProviderID: string
  SubRoutes: SubRoute[]
  BusRouteType: number
  RouteName: Name
  DepartureStopNameZh: string
  DepartureStopNameEn: string
  DestinationStopNameZh: string
  DestinationStopNameEn: string
  RouteMapImageUrl: string
  City: string
  CityCode: string
  UpdateTime: string
  VersionID: number
}

export interface ApiEstimatedTimeOfArrival {
  PlateNumb: string
  StopUID: string
  StopID: string
  StopName: Name
  RouteUID: string
  RouteID: string
  RouteName: Name
  SubRouteUID: string
  SubRouteID: string
  SubRouteName: Name
  Direction: number
  StopSequence: number
  StopStatus: number
  SrcUpdateTime: string
  UpdateTime: string
  EstimateTime?: number
  NextBusTime?: number
}

export interface ApiStopOfRoute {
  RouteUID: string
  RouteID: string
  RouteName: Name
  Operators: Operator[]
  SubRouteUID: string
  SubRouteID: string
  SubRouteName: Name
  Direction: number
  City: string
  CityCode: string
  Stops: Stop[]
  UpdateTime: string
  VersionID: number
}

export interface ApiShapeOfRoute {
  RouteUID: string
  RouteID: string
  RouteName: Name
  SubRouteName: Name
  Geometry: string
  EncodedPolyline: string
  UpdateTime: string
  VersionID: number
  SubRouteUID?: string
  SubRouteID?: string
}

export interface ApiParam {
  city: string
  routeName: string
}

export interface Name {
  Zh_tw: string
  En: string
}

export interface Direction {
  desc: string
  dir: number
}

export interface RouteList {
  direction: Direction[]
  label: string
}

export interface Operator {
  OperatorID: string
  OperatorName: Name
  OperatorCode: string
  OperatorNo: string
}

export interface Stop {
  StopUID: string
  StopID: string
  StopName: Name
  StopBoarding: number
  StopSequence: number
  StopPosition: StopPosition
  StationID: string
  LocationCityCode: string
}

export interface StopPosition {
  PositionLon: number
  PositionLat: number
  GeoHash: string
}

export interface Position {
  latitude: number
  longitude: number
}

export interface SubRoute {
  SubRouteUID: string
  SubRouteID: string
  OperatorIDs: string[]
  SubRouteName: Name
  Headsign: string
  Direction: number
}

export interface Coords {
  latitude: number
  longitude: number
}
