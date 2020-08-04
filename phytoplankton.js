/*
// Google Earth Engine app for tracking chlorophyll a reflectance.
// Free for all public use, MIT license, etc.
*/

// Filter collection for the dates and bands.
var modisOcean = ee.ImageCollection('NASA/OCEANDATA/MODIS-Aqua/L3SMI')
    .filterDate('2019-05-01', '2020-05-01');

var chlor_a = modisOcean.select(['chlor_a']);
var sst = modisOcean.select(['sst']);
            

// Setting up the map.

// Create a map panel.
var mapPanel = ui.Map();

mapPanel.setOptions('SATELLITE');
mapPanel.style().set('cursor', 'crosshair');

// Clear the map except the zoom control.
mapPanel.setControlVisibility(
    {all: false, zoomControl: true, mapTypeControl: false});

// Center the map and add to the app.
mapPanel.setCenter(8.431, 58.799, 4);
ui.root.widgets().reset([mapPanel]);
ui.root.setLayout(ui.Panel.Layout.flow('horizontal'));

// Setting the color palette for the chlorophyll a band.

var chVis = { palette:
                ['000066','ccffb3', '00cc00','267326'],
                min:0,
                max: 6.5
            
            };
            
// Add layers to the map.

mapPanel.add(ui.Map.Layer(chlor_a, chVis, ''));
mapPanel.add(ui.Map.Layer(sst, {}, '', 0));

// Create the side panel container.

var panel = ui.Panel();
panel.style().set('width', '300px');
panel.style().set('margin', '10px');
panel.style().set('padding', '5px');
panel.style().set('border', '1px solid lightblue');

// Create the intro panel with title and info text.
var intro = ui.Panel([
  ui.Label({
    value: 'Phytoplankton Explorer',
    style: {
            fontSize: '22px',
            color: 'darkgreen',
            fontWeight: 'bold',
            margin: '10px',
            fontFamily: 'Ubuntu',
            
          }
  }),
  
  ui.Label({
    value: 'The chlorophyll a reflections, captured by the MODIS sensor on the NASA Aqua satellite, indicate the presence of phytoplankton in bodies of water.',
    style: {
            margin: '10px',
            fontFamily: 'Roboto'
          }
  }),
  ui.Label({
    value: 'Phytoplankton thrives in nutrient-rich cooler waters around the poles and the equator. This microscopic organism plays an important role in the global food chain and geo-biological stability.',
    style: {
            margin: '10px',
            fontFamily: 'Roboto'
          }
  }),
  ui.Label({
    value: 'The map displays the chlorophyll a distribution for the years 2019-2020.',
    style: {
            margin: '10px'
          }
  }),
  ui.Label({
    value: 'Click a point on the map to inspect the region.',
    style: {
            margin: '10px'
          }
  }),
]);

panel.add(intro);

// Lat/Lon panels.
var lon = ui.Label({style:{color: 'darkgreen', padding: '5px'}});
var lat = ui.Label({style:{color: 'darkgreen', padding: '5px'}});
panel.add(ui.Panel([lon, lat], ui.Panel.Layout.flow('horizontal')));



// Map legend
// Provide parameters for color bar from a given palette.

function makeColorBarParams(palette) {
  return {
    bbox: [0, 0, 1, 0.1],
    dimensions: '100x10',
    format: 'png',
    min: 0,
    max: 1,
    palette: palette,
  };
}

// Palette for legend.

var legendPalette = {min:0, max:100, palette:['ccffb3', '00cc00','267326']};

// Create the color bar for the legend.
var colorBar = ui.Thumbnail({
  image: ee.Image.pixelLonLat().select(0),
  params: makeColorBarParams(legendPalette.palette),
  style: {stretch: 'horizontal', margin: '0px 8px', maxHeight: '24px'},
});

// Panel for the number guides.
var legendLabels = ui.Panel({
  widgets: [
    ui.Label(legendPalette.min, {margin: '4px 8px'}),
    ui.Label(
        (legendPalette.max / 2),
        {margin: '4px 8px', textAlign: 'center', stretch: 'horizontal'}),
    ui.Label(legendPalette.max, {margin: '4px 8px'})
  ],
  layout: ui.Panel.Layout.flow('horizontal')
});

var legendTitle = ui.Label({
  value: 'Map Legend: Mean chlorophyll a, 2019-2020 (mg/m^3)',
  style: {fontWeight: 'bold', textAlign: 'center', stretch: 'horizontal'}
});

// Putting the legend together.

var legendPanel = ui.Panel([legendTitle, colorBar, legendLabels]);
legendPanel.style().set('margin', '5px');
legendPanel.style().set('padding', '5px');

panel.add(legendPanel);

// Add the intro panel to the ui.root.
ui.root.insert(0, panel);

// Map click callback.

mapPanel.onClick(function(coords) {

  // Update the lon/lat panel with values from the click event. Round the numbers.
  lon.setValue('Lon: ' + coords.lon.toFixed(2)),
  lat.setValue('Lat: ' + coords.lat.toFixed(2));
  
  // Create the point from the click.
  var point = ee.Geometry.Point(coords.lon, coords.lat);
  
  // Add a dot for the point clicked on. Set it to the second layer on the map.
  var dot = ui.Map.Layer(point, {palette: ['lightgreen']}, '');
  mapPanel.layers().set(2, dot);
  
  
  // Properties of the panel for the charts.
  var chartPanelStyle = {
    width: '500px',
    height: '300px',
    margin: '10px',
    padding: '5px',
    position: 'bottom-right'
  };
  
  var chartPanel = ui.Panel([], ui.Panel.Layout.flow('vertical'), chartPanelStyle);
 
  // Chlorophyll a chart.
  var chlorChart = ui.Chart.image.series(chlor_a, point, ee.Reducer.mean(), 50);
  chlorChart.setChartType('ScatterChart');
  chlorChart.setOptions({
    title: 'Chlorophyll a (mg/m^3)',
    colors: ['green'],
    height: '120px',
    vAxis: {title: '', minValue: 0, maxValue: 100},
    hAxis: {format: 'MM-yy', gridlines: {count: 4}},
  });
  chlorChart.style().set({stretch: 'both'});
  chartPanel.widgets().set(2, chlorChart);

  // Temperature chart.
  var tempChart = ui.Chart.image.series(sst, point, ee.Reducer.mean(), 50);
  tempChart.setChartType('ScatterChart');
  tempChart.setOptions({
        title: 'Sea Surface Temperature (℃)',
        colors: ['blue'],
        height: '120px',
        vAxis: {title: '', maxValue: 40},
        hAxis: {format: 'MM-yy', gridlines: {count: 4}},
      });
    tempChart.style().set({stretch: 'both'});
    chartPanel.widgets().set(3, tempChart);
  
  // Setting the chart panel into the map.
    mapPanel.widgets().set(3, chartPanel);
});










