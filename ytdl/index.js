const fs = require('fs')
const Axios = require('axios')
const tunnel = require('tunnel')
const axios = Axios.create({
	proxy: false,
	httpsAgent: tunnel.httpsOverHttp({ proxy: { host: '127.0.0.1', port: '10809' } })
});
const path = require('path')
const getvid = require('./getvid')

module.exports = async (id) => {
	const {stream}  = await getvid(id)
	const res =await axios({
		url:stream[0].url,
		responseType: "stream"
	})
	const name = new Date().getTime() + '.mp4'
	const filePath = path.join(__dirname,'../mp4',name)
	const writer = fs.createWriteStream(filePath)
	res.data.pipe(writer)
	console.log('-----start download-----');
	return await new Promise((resolve, reject) => {
		writer.on('finish', _ => {
			console.log('------finish download------');
			resolve(name)
		})
	})
}