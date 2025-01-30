import { useState, useEffect } from "react";
import axios from "axios";
import { spaceId, accessToken } from "./contentfulConfig.js";
import "./ShippingCalculator.css";

function ShippingCalculator() {
    const [cities, setCities] = useState([]);
    // const [shippingMethods, setShippingMethods] = useState([]);
    const [fromCity, setFromCity] = useState("");
    const [toCity, setToCity] = useState("");
    // const [method, setMethod] = useState("");
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchCities = async () => {
        try {
            const response = await axios.get(
                `https://cdn.contentful.com/spaces/${spaceId}/environments/master/entries?access_token=${accessToken}&content_type=wareHouse`
            );
            const citiesData = response.data.items.map((item) => ({
                id: item.sys.id,
                name: item.fields.warehouseCity,
            }));
            console.log("cities data: ", citiesData);
            setCities(citiesData);
        } catch (error) {
            console.error("Error fetching cities:", error);
        }
    };

    // const fetchShippingMethods = async () => {
    //     try {
    //         const response = await axios.get(
    //             `https://cdn.contentful.com/spaces/${spaceId}/environments/master/entries?access_token=${accessToken}&content_type=shippingRates`
    //         );
    //         const methodsData = response.data.items.map(
    //             (item) => item.fields.method
    //         );
    //         setShippingMethods([...new Set(methodsData)]);
    //         console.log("method data: ", methodsData);
    //     } catch (error) {
    //         console.error("Error fetching shipping methods:", error);
    //     }
    // };

    const fetchShippingRates = async () => {
        // if (!fromCity || !toCity || !method) return;
        if (!fromCity || !toCity) return;

        setLoading(true);
        setResults(null);

        try {
            const response = await axios.get(
                // `https://cdn.contentful.com/spaces/${spaceId}/environments/master/entries?access_token=${accessToken}content_type=shippingRate&fields.fromCity=${fromCity}&fields.shippingMethod=${method}`
                `https://cdn.contentful.com/spaces/${spaceId}/environments/master/entries?access_token=${accessToken}&content_type=shippingRates&fields.fromCity=${fromCity}`
            );
            const rates = response.data.items.map((item) => ({
                cost: item.fields.cost,
                time: item.fields.time,
                city: item.fields.fromCity,
                method: item.fields.method,
            }));
            console.log("rate data: ", rates);
            if (rates.length === 0) {
                setResults("No available shipping options.");
            } else {
                calculateShippingOptions(rates);
            }
        } catch (error) {
            console.error("Error fetching shipping rates:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateShippingOptions = (shippingRates) => {
        let cheapest = shippingRates.reduce((min, option) =>
            option.cost < min.cost ? option : min
        );

        let quickest = shippingRates.reduce((min, option) =>
            option.time < min.time ? option : min
        );

        // Weighted scoring: 60% cost + 40% time
        let best = shippingRates.reduce((best, option) => {
            const score = option.cost * 0.6 + option.time * 0.4;
            const bestScore = best.cost * 0.6 + best.time * 0.4;
            console.log(
                `Option - City: ${option.city}, Method: ${option.method}, Cost: ${option.cost}, Time: ${option.time}, Score: ${score}`
            );
            console.log(
                `Best - City: ${best.city}, Method: ${best.method}, Cost: ${best.cost}, Time: ${best.time}, Score: ${score}`
            );

            return score < bestScore ? option : best;
        });

        cheapest.score = cheapest.cost * 0.6 + cheapest.time * 0.4;
        quickest.score = quickest.cost * 0.6 + quickest.time * 0.4;
        best.score = best.cost * 0.6 + best.time * 0.4;

        console.log("Cheapest:", cheapest);
        console.log("Quickest:", quickest);
        console.log("Best:", best);

        setResults({ cheapest, quickest, best });
    };

    useEffect(() => {
        fetchCities();
        // fetchShippingMethods();
    }, []);

    return (
        <div className="calculator-container">
            <h2 className="calculator-title">Shipping Calculator</h2>

            {/* From City Select */}
            <div className="form-container">
                <div className="field-container">
                    <label htmlFor="fromCity" className="label">
                        From City:
                    </label>
                    <select
                        id="fromCity"
                        value={fromCity}
                        onChange={(e) => setFromCity(e.target.value)}
                        className="input-select"
                    >
                        <option value="">Select City</option>
                        {cities.map((city) => (
                            <option key={city.id} value={city.name}>
                                {city.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* To City Input */}
                <div className="field-container">
                    <label htmlFor="toCity" className="label">
                        To City:
                    </label>
                    <input
                        type="text"
                        id="toCity"
                        value={toCity}
                        onChange={(e) => setToCity(e.target.value)}
                        className="input-text"
                        placeholder="Enter destination city"
                    />
                </div>

                {/* Shipping Method Select */}
                {/* <div className="field-container">
                <label htmlFor="method" className="label">
                Shipping Method:
                </label>
                <select
                id="method"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="input-select"
                >
                <option value="">Select Method</option>
                {shippingMethods.map((method, index) => (
                    <option key={index} value={method}>
                    {method}
                    </option>
                    ))}
                    </select>
                    </div> */}

                {/* Calculate Button */}
                <div className="button-container">
                    <button
                        onClick={fetchShippingRates}
                        className="button-calculate"
                    >
                        {loading ? "Calculating..." : "Calculate Shipping"}
                    </button>
                </div>
            </div>
            {/* Display Results */}
            {results && (
                <div className="results-container">
                    <h3 className="results-title">Results:</h3>
                    {typeof results === "string" ? (
                        <p>{results}</p>
                    ) : (
                        <>
                            <p>
                                <strong>Cheapest:</strong> ₹
                                {results.cheapest.cost} in{" "}
                                {results.cheapest.time}{" "}
                                {results.cheapest.time === 1 ? "day" : "days"}{" "}
                                via {results.cheapest.method}.
                                {/* Score:{" "}
                                {results.cheapest.score.toFixed(2)} */}
                            </p>
                            <p>
                                <strong>Quickest:</strong> ₹
                                {results.quickest.cost} in{" "}
                                {results.quickest.time}{" "}
                                {results.quickest.time === 1 ? "day" : "days"}{" "}
                                via {results.quickest.method}.
                                {/* Score:{" "}
                                {results.quickest.score.toFixed(2)} */}
                            </p>
                            <p>
                                <strong>Best:</strong> ₹{results.best.cost} in{" "}
                                {results.best.time}{" "}
                                {results.best.time === 1 ? "day" : "days"} via{" "}
                                {results.best.method}.
                                {/* Score:{" "}
                                {results.best.score.toFixed(2)} */}
                            </p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default ShippingCalculator;
