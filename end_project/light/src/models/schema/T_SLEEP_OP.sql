
  CREATE TABLE "RDMP"."T_SLEEP_OP" 
   (	"ID" NUMBER(*,0), 
	"TYPE" NUMBER(*,0), 
	"CONTENT" VARCHAR2(255 BYTE), 
	"YGBH" NUMBER(*,0), 
	"CREATEAT" DATE, 
	"CUSTOM" NUMBER
   ) SEGMENT CREATION IMMEDIATE 
  PCTFREE 10 PCTUSED 40 INITRANS 1 MAXTRANS 255 
 NOCOMPRESS LOGGING
  STORAGE(INITIAL 65536 NEXT 1048576 MINEXTENTS 1 MAXEXTENTS 2147483645
  PCTINCREASE 0 FREELISTS 1 FREELIST GROUPS 1
  BUFFER_POOL DEFAULT FLASH_CACHE DEFAULT CELL_FLASH_CACHE DEFAULT)
  TABLESPACE "RDMP" ;

   COMMENT ON COLUMN "RDMP"."T_SLEEP_OP"."ID" IS '主键id';
   COMMENT ON COLUMN "RDMP"."T_SLEEP_OP"."TYPE" IS '操作类型';
   COMMENT ON COLUMN "RDMP"."T_SLEEP_OP"."CONTENT" IS '操作内容';
   COMMENT ON COLUMN "RDMP"."T_SLEEP_OP"."YGBH" IS '操作员工编号';
   COMMENT ON COLUMN "RDMP"."T_SLEEP_OP"."CREATEAT" IS '操作时间';
   COMMENT ON COLUMN "RDMP"."T_SLEEP_OP"."CUSTOM" IS '客户编号';