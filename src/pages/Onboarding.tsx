import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Leaf } from "lucide-react";

export default function Onboarding() {
    const { profile, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        owner_name: profile?.owner_name || "",
        property_id: profile?.property_id || "",
        mobile_number: profile?.mobile_number || "",
        address: profile?.address || "",
        property_type: profile?.property_type || "",
        family_members: profile?.family_members?.toString() || "",
        property_size: profile?.property_size?.toString() || "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.owner_name || !formData.property_id || !formData.property_type) {
                throw new Error("Please fill in all required fields.");
            }

            await updateProfile({
                owner_name: formData.owner_name,
                property_id: formData.property_id,
                mobile_number: formData.mobile_number,
                address: formData.address,
                property_type: formData.property_type,
                family_members: parseInt(formData.family_members) || undefined,
                property_size: parseInt(formData.property_size) || undefined,
                profile_completed: true,
            });

            toast.success("Profile completed successfully!");
            navigate("/dashboard");
        } catch (error: any) {
            toast.error(error.message || "Failed to save profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
            <Card className="w-full max-w-2xl border-green-100 shadow-xl shadow-green-100/20">
                <CardHeader className="space-y-1 text-center pb-8 border-b border-green-50 mb-8 bg-green-50/30 rounded-t-xl">
                    <div className="mx-auto bg-green-100 w-16 h-16 flex items-center justify-center rounded-full mb-4">
                        <Leaf className="w-8 h-8 text-green-600" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">
                        Complete Your Profile
                    </CardTitle>
                    <CardDescription className="text-base">
                        Tell us a bit more about yourself to set up your waste management dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="owner_name">Full Name *</Label>
                                <Input
                                    id="owner_name"
                                    name="owner_name"
                                    placeholder="John Doe"
                                    value={formData.owner_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="property_id">Property ID *</Label>
                                <Input
                                    id="property_id"
                                    name="property_id"
                                    placeholder="e.g. APT-101"
                                    value={formData.property_id}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mobile_number">Mobile Number</Label>
                                <Input
                                    id="mobile_number"
                                    name="mobile_number"
                                    placeholder="+1 (555) 000-0000"
                                    value={formData.mobile_number}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="property_type">Property Type *</Label>
                                <Select
                                    value={formData.property_type}
                                    onValueChange={(val) => setFormData({ ...formData, property_type: val })}
                                    required
                                >
                                    <SelectTrigger className="w-full text-left">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="House">House</SelectItem>
                                        <SelectItem value="Apartment">Apartment</SelectItem>
                                        <SelectItem value="Society">Society</SelectItem>
                                        <SelectItem value="Commercial">Commercial</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="family_members">Number of Family Members</Label>
                                <Input
                                    id="family_members"
                                    name="family_members"
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 4"
                                    value={formData.family_members}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="property_size">Property Size (sq ft)</Label>
                                <Input
                                    id="property_size"
                                    name="property_size"
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 1200"
                                    value={formData.property_size}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address">Address string</Label>
                                <Input
                                    id="address"
                                    name="address"
                                    placeholder="123 Green Street, City"
                                    value={formData.address}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-6 text-lg mt-8 shadow-lg shadow-green-600/20"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Start Managing Waste"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
