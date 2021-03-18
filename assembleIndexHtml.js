const fs = require('fs')

fs.readFile('./portalDev/index.html', 'utf8' , (err, data) => {
  if (err) {
    console.error(err)
    return
  }
  
  var finalContent=data.replace(/portalDev\/bundle.js/g, 'bundle.min.js');

  fs.writeFile('index.html',finalContent, function (err) {
    if (err) return console.log(err);
  });

})