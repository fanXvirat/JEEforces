import dbConnect from "@/lib/dbConnect";
import {z} from "zod";
import UserModel from "@/backend/models/User.model";
import { usernameValidation } from "@/backend/schemas/Schemas";
 const UsernameQuerySchema=z.object({
        username:usernameValidation
    })
    export async function GET(request:Request){

        await dbConnect();
        try {
            const {searchParams}=new URL(request.url);
            const queryParams={
                username:searchParams.get("username")
            }
            const result=UsernameQuerySchema.safeParse(queryParams);
            if(!result.success){
                const usernameErrors=result.error.format().username?._errors || []
                return Response.json({
                    message:"Invalid username",
                    success:false
                },
                {
                    status:400
                })
            }
            
            const {username}=result.data;
            const existingverifiedusername=await UserModel.findOne({username})
            if(existingverifiedusername){
                return Response.json({
                    message:"Username already exists",
                    success:false
                },
                {
                    status:400
                })
            }
            else{
                return Response.json({
                    message:"Username is unique",
                    success:true
                },
                {
                    status:200
                })
            }
        } catch (error) {
            console.log(error,"error check username");
            return Response.json({
                message:"Internal server error",
                success:false
            },
            {
                status:500
            })
            
        }
    }