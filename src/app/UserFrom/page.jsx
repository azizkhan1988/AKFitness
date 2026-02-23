import { Col, Container, Row } from "react-bootstrap";
import AddUser from "@/src/app/components/addUser";
import styles from "@/styles/styles.module.scss";

const Page = () => {
    return (
        <section className="mainSection">
            <Container>
                <Row>
                    <Col md={12}>
                        <AddUser />
                    </Col>
                </Row>
            </Container>
        </section>
    )
}

export default Page