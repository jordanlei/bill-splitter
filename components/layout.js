import Head from "next/head";
import Menu from "./menu";
import Link from "next/link";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/global.css";

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Menu/>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="og:title" content="Hello" />
      </Head>
      <div>
        <main>{children}</main>
      </div>
    </div>
  );
};

export default Layout;
