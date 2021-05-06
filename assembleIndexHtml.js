const fs = require('fs')

fs.readFile('./portalDev/index.html', 'utf8' , (err, data) => {
  if (err) {
    console.error(err)
    return
  }
  
  var finalContent=data.replace(/bundle.js/g, 'bundle.min.js');
  var str='<script src="/reload/reload.js"></script>'
  finalContent=finalContent.replace(str, '');


  fs.writeFile('./portalProduction/index.html',finalContent, function (err) {
    if (err) return console.log(err);
  });

})