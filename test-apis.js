const axios = require('axios');

async function testAPIs() {
  try {
    console.log('测试角色API...');
    const roleResponse = await axios.get(
      'http://localhost:3000/system/role/list',
    );
    console.log('角色API响应:', roleResponse.data);

    console.log('\n测试部门API...');
    const deptResponse = await axios.get(
      'http://localhost:3000/system/dept/list',
    );
    console.log('部门API响应:', deptResponse.data);

    console.log('\n测试岗位API...');
    const postResponse = await axios.get(
      'http://localhost:3000/system/post/list',
    );
    console.log('岗位API响应:', postResponse.data);
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

testAPIs();
