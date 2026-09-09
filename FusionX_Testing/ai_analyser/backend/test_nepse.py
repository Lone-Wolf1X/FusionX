import asyncio
from nepse import AsyncNepse
import json

async def main():
    nepseAsync = AsyncNepse()
    nepseAsync.setTLSVerification(False)
    data = await nepseAsync.getLiveMarket()
    print(json.dumps(data[:2], indent=2))

if __name__ == "__main__":
    asyncio.run(main())
