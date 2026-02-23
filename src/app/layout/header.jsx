import { Col, Container, Row } from "react-bootstrap";
import Link from "next/link";
import { MainLogo } from "@/src/app/app-constants";

const Header = () => {
    return (
        <section className="headerSection" >
            <Container className="h-100">
                <Row className="h-100">
                    <Col md={6} className="my-auto">
                        <div className="mainLogo">
                            <Link href="/">
                                <MainLogo />                              
                            </Link>
                        </div>
                    </Col>
                    <Col md={6} className="my-auto">
                        <ul className="mainNavigation">
                            <li>
                                <Link href="/UserFrom">Add New Member</Link>
                            </li>
                            <li>
                                <Link href="/UserList">Member List</Link>
                            </li>
                        </ul>
                    </Col>
                </Row>
            </Container>
        </section>
    )
}

export default Header