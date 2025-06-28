import React from 'react';
import { View, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface PriceChartProps {
  data: number[];
  color?: string;
  height?: number;
  showAxis?: boolean;
  showLabels?: boolean;
  width?: number;
}

const PriceChart: React.FC<PriceChartProps> = ({
  data,
  color = '#3B82F6',
  height = 200,
  showAxis = true,
  showLabels = true,
  width
}) => {
  const screenWidth = width || Dimensions.get('window').width - 32;

  // Vérifier que nous avons des données
  if (!data || data.length === 0) {
    return <View style={{ height, backgroundColor: '#F3F4F6', borderRadius: 8 }} />;
  }

  // Préparer les données pour le graphique
  const chartData = {
    labels: showLabels ? data.map((_, index) => `${index + 1}`) : [''],
    datasets: [
      {
        data: data.length === 1 ? [data[0], data[0]] : data,
        color: (opacity = 1) => color + Math.round(opacity * 255).toString(16).padStart(2, '0'),
        strokeWidth: 2,
      }
    ]
  };

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 0,
    color: (opacity = 1) => color + Math.round(opacity * 255).toString(16).padStart(2, '0'),
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 8,
    },
    propsForDots: {
      r: showLabels ? '4' : '2',
      strokeWidth: '1',
      stroke: color,
    },
    propsForLabels: {
      fontSize: showLabels ? 12 : 0,
    },
    propsForBackgroundLines: {
      stroke: showAxis ? '#E5E7EB' : 'transparent',
      strokeWidth: 1,
    },
    withHorizontalLabels: showAxis && showLabels,
    withVerticalLabels: showAxis && showLabels,
    withInnerLines: showAxis,
    withOuterLines: showAxis,
    withHorizontalLines: showAxis,
    withVerticalLines: false,
  };

  return (
    <View style={{ 
      height, 
      justifyContent: 'center', 
      overflow: 'hidden',
      borderRadius: 8 
    }}>
      <LineChart
        data={chartData}
        width={screenWidth}
        height={height}
        chartConfig={chartConfig}
        bezier={true}
        style={{
          marginVertical: 0,
          borderRadius: 8,
        }}
        withDots={showLabels}
        withShadow={false}
        transparent={true}
      />
    </View>
  );
};

export default PriceChart;
