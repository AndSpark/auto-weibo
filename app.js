const puppeteer = require('puppeteer');
const fs = require('fs')
const ytdl = require('./ytdl')
const path = require('path')

const listJSON = fs.readFileSync('list.json')
const list = JSON.parse(listJSON)
class Weibo {

	async timeUp() {
		return await new Promise((resolve, reject) => {
			let timer = setInterval(() => {
				const now = new Date(),
					hour = now.getHours(),
					minute = now.getMinutes(),
					second = now.getSeconds(),
					hourT = 21,
					minuteT = 20,
					secondT = 59
				console.log(`当前时间为 ${hour}:${minute}:${second},距离目标时间还剩${hourT - hour}:${minuteT - minute}:${secondT - second}`);
				if (hour == hourT && minute == minuteT && second == secondT) {
					clearInterval(timer)
					resolve()
				}
			},1000)
		})
	}
	
	async getVideo(id,title) {
		const name = await ytdl(id)
		this.video = path.join(__dirname,'./mp4/',name) 
		this.title = title
	}

	async login() {
		this.browser = await puppeteer.launch({
			headless:false,
			slowMo: 250,
			executablePath: ''
		})

		this.page = await this.browser.newPage();

		await this.page.setViewport({
				width: 1280,
				height: 800
		})
		if (fs.existsSync('./cookies.json')) {
			const cookiesJSON = fs.readFileSync('./cookies.json', 'utf-8')
			const cookies = JSON.parse(cookiesJSON)
			await this.page.setCookie(...cookies)
			await this.page.goto("https://weibo.com/");
			this.page.cookies().then(cookies => {
				fs.writeFileSync('./cookies.json',JSON.stringify(cookies,null,2))
			})
			const isLogin = !(await this.page.$('.info_list.login_btn'))
			if (isLogin) {
				console.log('cookie 登录完成');
				return
			}
		}
		await this.page.goto("https://weibo.com/");
		await this.page.waitForNavigation();
		await this.page.click('[node-type="qrcode_tab"]')
		await this.page.screenshot({ path: './code.png' }) // 扫码登录
		await this.page.waitForNavigation()
		const cookies = await this.page.cookies()
		fs.writeFileSync('./cookies.json', JSON.stringify(cookies,null,2))
	}

	async sendMsg() {
		await this.page.click('.S_txt1[action-type="video"]')
		const videoInput = await this.page.$('[node-type="fileInput"][name="video"]')
		await videoInput.uploadFile(this.video)
		let timer;
		await new Promise(res => {
			timer = setInterval(async () => {
				const uploading = await this.page.$('[node-type="uploading"]')
				const isShow = await uploading.boxModel()
				if (!isShow) {
					clearInterval(timer)
					res(0)
				}
			}, 1000);
		})
		await this.page.type('[placeholder="好的标题可以获得更多推荐及粉丝"]', this.title)
		await this.page.click('.input_outer4')
		await this.page.click('[value="NEOTIC"]')
		await this.page.click('[node-type="completeBtn"]')
		await this.page.type('[title="微博输入框"]', `
		(yt: NEOTIC)
		`)
		await this.timeUp()
		await this.page.click('[title="发布微博按钮"]')
		await this.page.screenshot({ path: 'FINISH.png' })
		await this.browser.close()
	}
}


(async () => {
	const weibo = new Weibo()
	await weibo.getVideo(list[0].id,list[0].title)
	await weibo.login()
	await weibo.sendMsg()
	list.shift()
	fs.writeFileSync('list.json',JSON.stringify(list,null,2))
})()