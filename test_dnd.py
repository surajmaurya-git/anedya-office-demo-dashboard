import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))
        
        await page.goto("http://localhost:8080/builder")
        await page.wait_for_selector("text=Component Library", timeout=10000)
        
        # Look for Section component
        section_component = await page.query_selector("text=Section")
        canvas = await page.query_selector(".layout")
        if section_component and canvas:
            print("Found section and canvas. Dragging...")
            # We want to drag it near the top left of the canvas
            canvas_box = await canvas.bounding_box()
            await section_component.hover()
            await page.mouse.down()
            # Move slowly to canvas
            await page.mouse.move(canvas_box['x'] + 50, canvas_box['y'] + 50, steps=10)
            await page.mouse.up()
            await page.wait_for_timeout(1000)
            
            # Now we look for a Gauge to drag inside the section
            gauge_component = await page.query_selector("text=Gauge")
            section_title = await page.query_selector("text=Section Title")
            if gauge_component and section_title:
                print("Found gauge and section title. Dragging into section...")
                st_box = await section_title.bounding_box()
                # Drag the gauge into the section body (below the title)
                await gauge_component.hover()
                await page.mouse.down()
                await page.mouse.move(st_box['x'] + 50, st_box['y'] + 100, steps=10)
                await page.mouse.up()
                await page.wait_for_timeout(1000)
            else:
                print("Could not find gauge or section title")
        else:
            print("Could not find section or canvas")
        
        await browser.close()

asyncio.run(main())
