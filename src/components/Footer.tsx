import { Twitter, Instagram, Facebook, Linkedin, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary/30 mt-12 border-t">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-cyan-400 to-blue-500 flex items-center justify-center">
                <div className="w-5 h-5 bg-background rounded-full"></div>
              </div>
              <span className="text-xl font-semibold">Groww</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1 mb-6">
              <p>Vaishnavi Tech Park, South Tower, 3rd Floor</p>
              <p>Sarjapur Main Road, Bellandur, Bengaluru – 560103</p>
              <p>Karnataka</p>
            </div>
            <button className="text-sm text-primary underline mb-6">Contact Us</button>
            
            <div className="flex items-center gap-4 mb-6">
              <Twitter className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer" />
              <Instagram className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer" />
              <Facebook className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer" />
              <Linkedin className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer" />
              <Youtube className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer" />
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Download the App</div>
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-foreground rounded flex items-center justify-center text-background">
                  
                </div>
                <div className="w-8 h-8 bg-foreground rounded flex items-center justify-center text-background">
                  ▶
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">GROWW</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-foreground cursor-pointer">About Us</li>
              <li className="hover:text-foreground cursor-pointer">Pricing</li>
              <li className="hover:text-foreground cursor-pointer">Blog</li>
              <li className="hover:text-foreground cursor-pointer">Media & Press</li>
              <li className="hover:text-foreground cursor-pointer">Careers</li>
              <li className="hover:text-foreground cursor-pointer">Help & Support</li>
              <li className="hover:text-foreground cursor-pointer">Trust & Safety</li>
              <li className="hover:text-foreground cursor-pointer">Investor Relations</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">PRODUCTS</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-foreground cursor-pointer">Stocks</li>
              <li className="hover:text-foreground cursor-pointer">F&O</li>
              <li className="hover:text-foreground cursor-pointer">MTF</li>
              <li className="hover:text-foreground cursor-pointer">ETF</li>
              <li className="hover:text-foreground cursor-pointer">IPO</li>
              <li className="hover:text-foreground cursor-pointer">Mutual Funds</li>
              <li className="hover:text-foreground cursor-pointer">Commodities</li>
              <li className="hover:text-foreground cursor-pointer">Groww Terminal</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 invisible">More</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-foreground cursor-pointer">915 Terminal</li>
              <li className="hover:text-foreground cursor-pointer">Stocks Screener</li>
              <li className="hover:text-foreground cursor-pointer">Algo Trading</li>
              <li className="hover:text-foreground cursor-pointer">Groww Digest</li>
              <li className="hover:text-foreground cursor-pointer">Demat Account</li>
              <li className="hover:text-foreground cursor-pointer">Groww AMC</li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-8 text-sm">
              <button className="font-medium border-b-2 border-foreground pb-2">Share Market</button>
              <button className="text-muted-foreground hover:text-foreground">Indices</button>
              <button className="text-muted-foreground hover:text-foreground">F&O</button>
              <button className="text-muted-foreground hover:text-foreground">Mutual Funds</button>
              <button className="text-muted-foreground hover:text-foreground">ETFs</button>
              <button className="text-muted-foreground hover:text-foreground">Funds By Groww</button>
              <button className="text-muted-foreground hover:text-foreground">Calculators</button>
              <button className="text-muted-foreground hover:text-foreground">IPO</button>
              <button className="text-muted-foreground hover:text-foreground">Miscellaneous</button>
            </div>
            <div className="text-sm text-muted-foreground">Version: 6.7.8</div>
          </div>

          <div className="grid grid-cols-5 gap-8 text-sm">
            <div>
              <ul className="space-y-2 text-muted-foreground">
                <li className="hover:text-foreground cursor-pointer">Top Gainers Stocks</li>
                <li className="hover:text-foreground cursor-pointer">52 Weeks High Stocks</li>
                <li className="hover:text-foreground cursor-pointer">Tata Motors</li>
                <li className="hover:text-foreground cursor-pointer">NHPC</li>
                <li className="hover:text-foreground cursor-pointer">ITC</li>
                <li className="hover:text-foreground cursor-pointer">Wipro</li>
              </ul>
            </div>
            <div>
              <ul className="space-y-2 text-muted-foreground">
                <li className="hover:text-foreground cursor-pointer">Top Losers Stocks</li>
                <li className="hover:text-foreground cursor-pointer">52 Weeks Low Stocks</li>
                <li className="hover:text-foreground cursor-pointer">IREDA</li>
                <li className="hover:text-foreground cursor-pointer">State Bank of India</li>
                <li className="hover:text-foreground cursor-pointer">Adani Power</li>
                <li className="hover:text-foreground cursor-pointer">CDSL</li>
              </ul>
            </div>
            <div>
              <ul className="space-y-2 text-muted-foreground">
                <li className="hover:text-foreground cursor-pointer">Most Traded Stocks</li>
                <li className="hover:text-foreground cursor-pointer">Stocks Market Calender</li>
                <li className="hover:text-foreground cursor-pointer">Tata Steel</li>
                <li className="hover:text-foreground cursor-pointer">Tata Power</li>
                <li className="hover:text-foreground cursor-pointer">Bharat Heavy Electricals</li>
                <li className="hover:text-foreground cursor-pointer">Indian Oil Corporation</li>
              </ul>
            </div>
            <div>
              <ul className="space-y-2 text-muted-foreground">
                <li className="hover:text-foreground cursor-pointer">Stocks Feed</li>
                <li className="hover:text-foreground cursor-pointer">Suzlon Energy</li>
                <li className="hover:text-foreground cursor-pointer">Zomato (Eternal)</li>
                <li className="hover:text-foreground cursor-pointer">Yes Bank</li>
                <li className="hover:text-foreground cursor-pointer">Infosys</li>
                <li className="hover:text-foreground cursor-pointer">NBCC</li>
              </ul>
            </div>
            <div>
              <ul className="space-y-2 text-muted-foreground">
                <li className="hover:text-foreground cursor-pointer">FII DII Activity</li>
                <li className="hover:text-foreground cursor-pointer">IRFC</li>
                <li className="hover:text-foreground cursor-pointer">Bharat Electronics</li>
                <li className="hover:text-foreground cursor-pointer">HDFC Bank</li>
                <li className="hover:text-foreground cursor-pointer">Vedanta</li>
                <li className="hover:text-foreground cursor-pointer">Reliance Power</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 text-sm text-muted-foreground">
            © 2016-2025 Groww. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
