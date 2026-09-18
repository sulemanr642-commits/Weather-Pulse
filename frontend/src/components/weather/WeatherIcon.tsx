import React from 'react';
import WeatherSymbol, { WeatherSymbolProps } from './WeatherSymbol';

export type WeatherIconProps = WeatherSymbolProps;

export const WeatherIcon: React.FC<WeatherIconProps> = (props) => {
  return <WeatherSymbol {...props} />;
};

export default WeatherIcon;
