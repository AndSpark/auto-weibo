const fs = require('fs')
const Axios = require('axios')
const tunnel = require('tunnel')
const axios = Axios.create({
	proxy: false,
	httpsAgent: tunnel.httpsOverHttp({ proxy: { host: '127.0.0.1', port: '10809' } })
});

const getvid = require('./getvid')

module.exports = async (id) => {
	const {adaptive}  = await getvid(id)
	const { url } = adaptive.find(v => v.qualityLabel === '720p' )
	axios({
		url,
		responseType: "stream"
	}).then(res => {
		const name = '../mp4/' + new Date().getTime() + '.mp4'
		res.data.pipe(fs.createWriteStream(name))
		res.data.pipe.on('end', _ => {
			return Promise.resolve(name)
		})
	})
}