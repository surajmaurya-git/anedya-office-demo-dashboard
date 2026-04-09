import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto("http://localhost:8080/builder", wait_until="networkidle")
        await page.screenshot(path="snapshot.png", full_page=True)
        await browser.close()
        print("Done")

asyncio.run(main())
