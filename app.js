const puppeteer = require('puppeteer');
const fs = require('fs')
const ytdl = require('./ytdl')

class Weibo {
	
	async getVideo(id,title) {
		const name = await ytdl(id)
		this.video = './mp4/' + name
		this.title = title
	}

	async login() {
		this.browser = await puppeteer.launch({
			slowMo: 250,
			executablePath: ''
		})

		this.page = await this.browser.newPage();

		await this.page.setViewport({
				width: 1280,
				height: 800
		})
		if (fs.existsSync('./cookies.txt')) {
			const cookiesJSON = fs.readFileSync('./cookies.txt', 'utf-8')
			const cookies = JSON.parse(cookiesJSON)
			await this.page.setCookie(...cookies)
			await this.page.goto("https://weibo.com/");
			this.page.cookies().then(cookies => {
				fs.writeFileSync('./cookies.txt',JSON.stringify(cookies))
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
		fs.writeFileSync('./cookies.txt', JSON.stringify(cookies))
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
		await this.page.click('[title="发布微博按钮"]')
		await this.page.screenshot({ path: '3.png' })
		
	}
}


(async () => {
	const weibo = new Weibo()
	await weibo.getVideo(id,title)
	await weibo.login()
	await weibo.sendMsg()
})()