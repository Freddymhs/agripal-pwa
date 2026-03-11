import os
from pathlib import Path

from playwright.sync_api import sync_playwright


def main() -> None:
    base_url = os.environ.get("BASE_URL", "http://localhost:3000").rstrip("/")
    out_dir = Path(os.environ.get("SMOKE_OUT_DIR", ".cache/smoke"))
    out_dir.mkdir(parents=True, exist_ok=True)

    console_messages: list[str] = []
    page_errors: list[str] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        def on_console(msg) -> None:  # type: ignore[no-untyped-def]
            if msg.type in {"error", "warning"}:
                console_messages.append(f"[{msg.type}] {msg.text}")

        def on_page_error(err) -> None:  # type: ignore[no-untyped-def]
            page_errors.append(str(err))

        page.on("console", on_console)
        page.on("pageerror", on_page_error)

        page.goto(base_url, wait_until="domcontentloaded")
        page.wait_for_load_state("networkidle")

        title = page.title()
        current_url = page.url
        screenshot_path = out_dir / "home.png"
        page.screenshot(path=str(screenshot_path), full_page=True)

        has_next_error_overlay = (
            page.locator("text=Unhandled Runtime Error").count() > 0
            or page.locator("text=Application error: a client-side exception has occurred")
            .count()
            > 0
        )

        print(f"BASE_URL={base_url}")
        print(f"URL={current_url}")
        print(f"TITLE={title}")
        print(f"SCREENSHOT={screenshot_path.resolve()}")
        print(f"NEXT_ERROR_OVERLAY={has_next_error_overlay}")

        if page_errors:
            print("PAGE_ERRORS_START")
            for err in page_errors:
                print(err)
            print("PAGE_ERRORS_END")

        if console_messages:
            print("CONSOLE_START")
            for line in console_messages:
                print(line)
            print("CONSOLE_END")

        browser.close()


if __name__ == "__main__":
    main()
