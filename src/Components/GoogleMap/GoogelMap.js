import React, { useState, useRef } from 'react';
import GoogleMapReact from 'google-map-react';
import Geocode from 'react-geocode';
import WireframeInfo from './helpers/Wireframe';

Geocode.setApiKey('');
Geocode.setLanguage("en");
Geocode.setRegion("us");

const GoogleMap = () => {
    const [mapApi, setMapApi] = useState({});
    const defaultProps = {
        center: {
            "lat": 41.48826124328076,
            "lng": -93.9382754266262
        },
        zoom: 25,
    };
    const mapRef = useRef();
    return (
        <div style={{ height: '100%', width: '100%' }}>
            <GoogleMapReact
                onGoogleApiLoaded={({ map, maps }) => {
                    setMapApi({ map, maps })
                    mapRef.current = map;
                }}
                bootstrapURLKeys={{ key: '', libraries: 'places' }}
                yesIWantToUseGoogleMapApiInternals
                defaultCenter={defaultProps.center}
                defaultZoom={defaultProps.zoom}
                options={maps => {
                    return {
                        mapTypeId: 'satellite',
                        disableDefaultUI: true,
                        tilt: 0,
                    };
                }}
            >


            </GoogleMapReact>
            <WireframeInfo
                map={mapApi.map}
                maps={mapApi.maps}
                data={{
                    json: 'https://obt-test-eu.s3.eu-west-1.amazonaws.com/Superstorm_Restoration_Des_Moines_Iowa_United_States_Iowa_Van_Meter_110th_Street_2586_2024_4_27_3_37_33_measurements_e36b50ddfb.json',
                    xml: 'https://obt-test-eu.s3.eu-west-1.amazonaws.com/Superstorm_Restoration_Des_Moines_Iowa_United_States_Iowa_Van_Meter_110th_Street_2586_2024_4_27_3_37_33_info_e03bd6bf2d.xml'
                }}
            />
        </div>
    );
};

export default GoogleMap;
