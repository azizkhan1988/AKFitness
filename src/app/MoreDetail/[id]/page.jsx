import { Col, Container, Row } from "react-bootstrap";
import UserList from "@/src/app/components/userList";


const Page = () => {
    return (
        <section className="mainSection">
            <Container>
                <Row>
                    <Col md={12}>
                        <UserList />
                    </Col>
                </Row>
            </Container>
        </section>
    )
}

export default Page